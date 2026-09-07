---
name: Orval and Zod compatibility
description: Compatibility constraints for generated schemas in this workspace
---

The workspace currently uses Zod 3 through the package catalog while Orval can generate Zod 4-style helpers for integer schemas. Multipart schemas also require DOM types during library compilation, and the generated API/types barrels can duplicate request-body exports.

**Why:** API code generation initially produced `zod.int`, missing `File`/`Blob` types, and a duplicate export when the contract used integer and binary fields.

**How to apply:** Prefer numeric schemas when an integer-only distinction is not essential, include DOM types for generated API schema compilation when binary fields are present, and verify the public Zod barrel after every codegen run; if codegen re-adds the generated-types barrel, remove that duplicate re-export before the workspace typecheck.