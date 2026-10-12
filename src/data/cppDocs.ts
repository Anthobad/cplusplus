import { CppDocItem } from "../types";
import { CCTYPE_DOCS } from "./cppDocs/cctypeDocs";
import { CMATH_DOCS } from "./cppDocs/cmathDocs";
import { ALGORITHM_DOCS } from "./cppDocs/algorithmDocs";
import { ITERATOR_DOCS } from "./cppDocs/iteratorDocs";
import { STRING_DOCS } from "./cppDocs/stringDocs";
import { REGEX_DOCS } from "./cppDocs/regexDocs";
import { CORE_DOCS } from "./cppDocs/coreDocs";

export const CPP_DOCS: CppDocItem[] = [
  ...CORE_DOCS,
  ...ALGORITHM_DOCS,
  ...STRING_DOCS,
  ...ITERATOR_DOCS,
  ...CMATH_DOCS,
  ...CCTYPE_DOCS,
  ...REGEX_DOCS
];

export {
  CCTYPE_DOCS,
  CMATH_DOCS,
  ALGORITHM_DOCS,
  ITERATOR_DOCS,
  STRING_DOCS,
  REGEX_DOCS,
  CORE_DOCS
};
