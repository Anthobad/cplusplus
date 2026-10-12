#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Automated Production C++ Runner Deployment & Website Binding Script
#
# Usage:
#   ./runner/deploy.sh [PROJECT_ID] [REGION] [WEBSITE_SERVICE]
#
# Examples:
#   ./runner/deploy.sh concentrated-fusion-tdw25 europe-west1
#   ./runner/deploy.sh concentrated-fusion-tdw25 europe-west1 ais-pre-julu2jrjignmbm4ku7pd2w
# ==============================================================================

SERVICE_NAME="cpp-isolated-runner"
PROJECT_ID="${1:-}"
TARGET_REGION="${2:-}"
WEBSITE_OVERRIDE="${3:-}"
KNOWN_PRODUCTION_SERVICE="ais-pre-julu2jrjignmbm4ku7pd2w"

echo "=========================================================="
echo "Automated C++ Runner Production Deployment & Website Link"
echo "=========================================================="

# 0. Determine Target Project ID
if [[ -z "${PROJECT_ID}" ]]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
fi
if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  PROJECT_ID="concentrated-fusion-tdw25"
fi
echo "Target Google Cloud Project: ${PROJECT_ID}"

# Ensure dist/server.js is built from TypeScript
cd "$(dirname "$0")"
if command -v npx >/dev/null 2>&1; then
  echo "Building standalone runner bundle with esbuild..."
  npx esbuild server.ts --bundle --platform=node --format=cjs --outfile=dist/server.js
elif [[ -f "dist/server.js" ]]; then
  echo "Using pre-built runner bundle (dist/server.js)..."
else
  echo "Error: dist/server.js not found and npx is not available to build it."
  exit 1
fi

# 1. Discover the Website Cloud Run Service (Strict, Unambiguous Resolution)
echo ""
echo "--- Step 1: Discovering Website Cloud Run Service ---"
WEBSITE_SERVICE="${WEBSITE_OVERRIDE:-}"
WEBSITE_REGION=""

if [[ -z "${WEBSITE_SERVICE}" ]]; then
  echo "Scanning Cloud Run services in project ${PROJECT_ID}..."
  SERVICES_RAW=$(gcloud run services list --project="${PROJECT_ID}" --format="csv[no-heading](metadata.name,region)" 2>/dev/null || true)
  CANDIDATE_SERVICES=$(echo "${SERVICES_RAW}" | grep -v "^${SERVICE_NAME}," | grep -v '^$' || true)

  # Check 1: Does the known exact production service exist?
  EXACT_MATCH=$(echo "${CANDIDATE_SERVICES}" | grep "^${KNOWN_PRODUCTION_SERVICE}," || true)
  if [[ -n "${EXACT_MATCH}" ]]; then
    WEBSITE_SERVICE=$(echo "${EXACT_MATCH}" | head -n 1 | cut -d',' -f1)
    WEBSITE_REGION=$(echo "${EXACT_MATCH}" | head -n 1 | cut -d',' -f2)
    echo "Discovered exact matching production service: ${WEBSITE_SERVICE} (Region: ${WEBSITE_REGION})"
  else
    # Check 2: Look for unambiguous 'ais-pre-*' production services (never select ais-dev-*)
    PRE_CANDIDATES=$(echo "${CANDIDATE_SERVICES}" | grep "^ais-pre-" || true)
    PRE_COUNT=$(echo "${PRE_CANDIDATES}" | grep -c . || true)

    if [[ "${PRE_COUNT}" -eq 1 ]]; then
      WEBSITE_SERVICE=$(echo "${PRE_CANDIDATES}" | cut -d',' -f1)
      WEBSITE_REGION=$(echo "${PRE_CANDIDATES}" | cut -d',' -f2)
      echo "Discovered unambiguous 'ais-pre-*' production service: ${WEBSITE_SERVICE} (Region: ${WEBSITE_REGION})"
    elif [[ "${PRE_COUNT}" -gt 1 ]]; then
      echo "ERROR: Multiple 'ais-pre-*' production services detected in project ${PROJECT_ID}:"
      echo "${PRE_CANDIDATES}"
      echo ""
      echo "Ambiguity detected. Refusing to guess which service should receive production runner configuration."
      echo "Please specify the target website service explicitly as the 3rd argument:"
      echo "./runner/deploy.sh ${PROJECT_ID} ${TARGET_REGION:-<REGION>} <EXACT_WEBSITE_SERVICE>"
      exit 1
    else
      # Check 3: Check if there is exactly one non-development service
      NON_DEV_CANDIDATES=$(echo "${CANDIDATE_SERVICES}" | grep -v "^ais-dev-" || true)
      NON_DEV_COUNT=$(echo "${NON_DEV_CANDIDATES}" | grep -c . || true)

      if [[ "${NON_DEV_COUNT}" -eq 1 ]]; then
        WEBSITE_SERVICE=$(echo "${NON_DEV_CANDIDATES}" | cut -d',' -f1)
        WEBSITE_REGION=$(echo "${NON_DEV_CANDIDATES}" | cut -d',' -f2)
        echo "Discovered single candidate non-development service: ${WEBSITE_SERVICE} (Region: ${WEBSITE_REGION})"
      else
        echo "ERROR: Could not confidently identify an unambiguous production website service in project ${PROJECT_ID}."
        if [[ -n "${CANDIDATE_SERVICES}" ]]; then
          echo "Discovered candidate Cloud Run services:"
          echo "${CANDIDATE_SERVICES}"
        else
          echo "No active Cloud Run services found in project ${PROJECT_ID}."
        fi
        echo ""
        echo "To avoid misconfiguring an environment, please specify the target website service explicitly:"
        echo "./runner/deploy.sh ${PROJECT_ID} ${TARGET_REGION:-<REGION>} <EXACT_WEBSITE_SERVICE>"
        exit 1
      fi
    fi
  fi
else
  # Website service explicitly supplied as argument
  echo "Using explicitly provided website service: ${WEBSITE_SERVICE}"
  DETECTED_REGION=$(gcloud run services list --project="${PROJECT_ID}" --filter="metadata.name=${WEBSITE_SERVICE}" --format="value(region)" 2>/dev/null | head -n 1 || true)
  if [[ -n "${DETECTED_REGION}" ]]; then
    WEBSITE_REGION="${DETECTED_REGION}"
  else
    WEBSITE_REGION="${TARGET_REGION:-europe-west1}"
  fi
fi

# Enforce: Never choose ais-dev-* for production runner configuration
if [[ "${WEBSITE_SERVICE}" == ais-dev-* ]]; then
  echo "ERROR: '${WEBSITE_SERVICE}' is an internal development/debug environment ('ais-dev-*')."
  echo "Production runner configuration must only be applied to published production services ('ais-pre-*')."
  echo "Refusing to apply production runner configuration to a development environment."
  exit 1
fi

if [[ -z "${WEBSITE_SERVICE}" ]]; then
  echo "ERROR: No valid production website service identified. Aborting."
  exit 1
fi

RUNNER_REGION="${TARGET_REGION:-${WEBSITE_REGION}}"
echo "Target Deployment Regions -> Runner: ${RUNNER_REGION}, Website: ${WEBSITE_REGION}"

# 2. Discover the Website's Actual Service Account
echo ""
echo "--- Step 2: Discovering Website Service Account ---"
WEBSITE_SA=$(gcloud run services describe "${WEBSITE_SERVICE}" \
  --project="${PROJECT_ID}" \
  --region="${WEBSITE_REGION}" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)

if [[ -z "${WEBSITE_SA}" ]]; then
  # When spec.template.spec.serviceAccountName is empty, Cloud Run defaults to the Compute Engine default service account
  PROJECT_NUM=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)' 2>/dev/null || echo "588239623600")
  WEBSITE_SA="${PROJECT_NUM}-compute@developer.gserviceaccount.com"
  echo "Website runs under Compute Engine default service account: ${WEBSITE_SA}"
else
  echo "Website runs under dedicated service account: ${WEBSITE_SA}"
fi

if [[ -z "${WEBSITE_SA}" ]]; then
  echo "ERROR: Could not resolve service account for website service '${WEBSITE_SERVICE}'. Aborting."
  exit 1
fi

# 3. Deploy the Separate Isolated C++ Runner Service
echo ""
echo "--- Step 3: Deploying Isolated C++ Runner Service ---"
echo "Service Name: ${SERVICE_NAME}"
echo "Region:       ${RUNNER_REGION}"
echo "Security:     --no-allow-unauthenticated (Private authenticated IAM only)"
echo "Free Tier:    Scale-to-zero (minScale=0), 512MiB RAM, 1 vCPU"

gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${RUNNER_REGION}" \
  --platform managed \
  --no-allow-unauthenticated \
  --execution-environment gen2 \
  --min-instances 0 \
  --max-instances 2 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 30s \
  --concurrency 4

RUNNER_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${RUNNER_REGION}" \
  --format='value(status.url)')

if [[ -z "${RUNNER_URL}" || "${RUNNER_URL}" != https://* ]]; then
  echo "ERROR: Failed to retrieve valid HTTPS URL for deployed runner service '${SERVICE_NAME}'."
  exit 1
fi
echo "Runner successfully deployed at: ${RUNNER_URL}"

# 4. Authorize Website Service Account on Runner (Cloud Run Invoker Role)
echo ""
echo "--- Step 4: Binding Cloud Run Invoker IAM Permission ---"
echo "Granting roles/run.invoker on ${SERVICE_NAME} to ${WEBSITE_SA}..."
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${RUNNER_REGION}" \
  --member="serviceAccount:${WEBSITE_SA}" \
  --role="roles/run.invoker" \
  --quiet

echo "IAM policy binding command completed."

# 5. Automatically Configure Website Service with ISOLATED_RUNNER_ENDPOINT
echo ""
echo "--- Step 5: Updating Website Service Configuration ---"
echo "Setting ISOLATED_RUNNER_ENDPOINT=${RUNNER_URL} on website service ${WEBSITE_SERVICE}..."
gcloud run services update "${WEBSITE_SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${WEBSITE_REGION}" \
  --update-env-vars "ISOLATED_RUNNER_ENDPOINT=${RUNNER_URL}" \
  --quiet

echo "Website service environment update command completed."

# 6. Strict Production Verification
echo ""
echo "--- Step 6: Strict Production Verification ---"
VERIFICATION_FAILED=0

# 6a. Verify runner service deployment & URL
echo "[1/6] Verifying runner service deployment..."
if [[ -n "${RUNNER_URL}" && "${RUNNER_URL}" == https://* ]]; then
  echo "      PASS: Runner service active at ${RUNNER_URL}"
else
  echo "      FAILED: Runner URL '${RUNNER_URL}' is invalid or empty."
  VERIFICATION_FAILED=1
fi

# 6b. Verify perimeter security: runner strictly rejects unauthenticated access
echo "[2/6] Verifying runner rejects unauthenticated requests..."
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${RUNNER_URL}/health" || echo "000")
if [[ "${UNAUTH_CODE}" == "401" || "${UNAUTH_CODE}" == "403" ]]; then
  echo "      PASS: Unauthenticated access blocked with HTTP ${UNAUTH_CODE}."
else
  echo "      FAILED: Perimeter security check failed. Runner returned HTTP ${UNAUTH_CODE} (expected 401 or 403)."
  VERIFICATION_FAILED=1
fi

# 6c. Verify roles/run.invoker IAM policy binding on runner
echo "[3/6] Verifying Cloud Run Invoker IAM policy binding on runner..."
POLICY_JSON=$(gcloud run services get-iam-policy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${RUNNER_REGION}" \
  --format=json 2>/dev/null || echo "{}")

HAS_INVOKER=$(echo "${POLICY_JSON}" | grep -B 2 -A 5 "roles/run.invoker" | grep "serviceAccount:${WEBSITE_SA}" || true)
if [[ -n "${HAS_INVOKER}" ]]; then
  echo "      PASS: Service account ${WEBSITE_SA} confirmed in roles/run.invoker binding."
else
  echo "      FAILED: roles/run.invoker binding for serviceAccount:${WEBSITE_SA} not found on ${SERVICE_NAME}."
  VERIFICATION_FAILED=1
fi

# 6d. Read back website configuration and confirm exact ISOLATED_RUNNER_ENDPOINT
echo "[4/6] Verifying website environment variable configuration..."
READBACK_ENDPOINT=$(gcloud run services describe "${WEBSITE_SERVICE}" \
  --project="${PROJECT_ID}" \
  --region="${WEBSITE_REGION}" \
  --format='value(spec.template.spec.containers[0].env)' 2>/dev/null | grep -o "ISOLATED_RUNNER_ENDPOINT=[^,]*" | cut -d'=' -f2 || true)

if [[ "${READBACK_ENDPOINT}" == "${RUNNER_URL}" ]]; then
  echo "      PASS: Website ISOLATED_RUNNER_ENDPOINT readback matches exact runner URL: ${READBACK_ENDPOINT}"
else
  echo "      FAILED: Website environment variable readback mismatch."
  echo "            Expected: ${RUNNER_URL}"
  echo "            Got:      ${READBACK_ENDPOINT}"
  VERIFICATION_FAILED=1
fi

# 6e. Perform authenticated invocation of runner /health
echo "[5/6] Verifying authenticated invocation of runner..."
ID_TOKEN=$(gcloud auth print-identity-token --audiences="${RUNNER_URL}" 2>/dev/null || true)
AUTH_HEALTH_OK=0
UNSHARE_NET_ACTIVE=0

if [[ -n "${ID_TOKEN}" ]]; then
  AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer ${ID_TOKEN}" "${RUNNER_URL}/health" || echo "")
  if echo "${AUTH_RESPONSE}" | grep -q '"status":"ok"'; then
    echo "      PASS: Authenticated /health check succeeded."
    AUTH_HEALTH_OK=1
    if echo "${AUTH_RESPONSE}" | grep -q '"unshareNet":true'; then
      UNSHARE_NET_ACTIVE=1
    fi
  else
    echo "      FAILED: Authenticated /health check returned unexpected payload: ${AUTH_RESPONSE}"
    VERIFICATION_FAILED=1
  fi
else
  echo "      FAILED: Could not obtain Google Cloud identity token for verification probe."
  VERIFICATION_FAILED=1
fi

# 6f. Report kernel network namespace isolation accurately
echo "[6/6] Checking kernel network namespace isolation capabilities..."
if [[ "${UNSHARE_NET_ACTIVE}" -eq 1 ]]; then
  echo "      NETWORK ISOLATION: available/enforced (unshare --net active in container)"
else
  echo "      NETWORK ISOLATION: unavailable"
fi

if [[ "${VERIFICATION_FAILED}" -ne 0 ]]; then
  echo ""
  echo "=========================================================="
  echo "DEPLOYMENT VERIFICATION FAILED"
  echo "One or more required production security verifications failed."
  echo "Check the errors above and ensure permissions and configurations are correct."
  echo "=========================================================="
  exit 1
fi

# 7. Final Verified Status
echo ""
echo "=========================================================="
echo "DEPLOYMENT VERIFIED & PRODUCTION READY"
echo "Runner Service:        ${SERVICE_NAME} (Region: ${RUNNER_REGION})"
echo "Runner URL:            ${RUNNER_URL}"
echo "Website Service:       ${WEBSITE_SERVICE} (Region: ${WEBSITE_REGION})"
echo "Website SA:            ${WEBSITE_SA}"
echo "Auth Mode:             Private Google Cloud OIDC (roles/run.invoker)"
echo "Website Config:        ISOLATED_RUNNER_ENDPOINT=${RUNNER_URL}"
if [[ "${UNSHARE_NET_ACTIVE}" -eq 1 ]]; then
  echo "Network Isolation:     available/enforced (unshare --net)"
else
  echo "Network Isolation:     unavailable (process & memory limits enforced)"
fi
echo "=========================================================="
