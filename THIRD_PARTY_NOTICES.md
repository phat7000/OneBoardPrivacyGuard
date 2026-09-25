# Third-Party Notices

OneBoard Privacy Guard's application-shell source is licensed under MIT. The application also includes or uses the components below. Copyright remains with their respective authors.

## DocCloak.Core 0.12.1

- Source: https://github.com/WLojek/DocCloak.Core
- License: Apache License 2.0
- Notice: “DocCloak.Core — privacy-preserving PII anonymization engine.”

DocCloak.Core is the detection, placeholder/session, Office protection, and OCR integration engine. OneBoard does not claim authorship of DocCloak.Core. Its Apache-2.0 license is included in the installed npm dependency and release source.

## Tauri

- Source: https://github.com/tauri-apps/tauri
- License: Apache-2.0 OR MIT

The official Tauri HTTP plugin is used only for model downloads in the packaged WebView, with its capability restricted to the model hosts listed in the application policy. The plugin is Apache-2.0 OR MIT licensed.

## React and React DOM

- Source: https://github.com/facebook/react
- License: MIT

## ONNX Runtime Web

- Source: https://github.com/microsoft/onnxruntime
- License: MIT

The WebAssembly runtime files shipped in the application come from the locked `onnxruntime-web` dependency and are served only from the packaged application.

## Transformers.js

- Source: https://github.com/huggingface/transformers.js
- License: Apache-2.0

Used locally to construct tokenizers from files downloaded and hash-verified by DocCloak.Core.

## Tesseract.js and Tesseract.js Core

- Source: https://github.com/naptha/tesseract.js
- License: Apache-2.0

The worker and WebAssembly runtime are bundled and served locally.

## Tesseract trained data (English and Vietnamese)

- Source: https://github.com/tesseract-ocr/tessdata_fast
- License: Apache-2.0

`eng.traineddata.gz` and `vie.traineddata.gz` are bundled for offline local OCR. Language data is not uploaded and does not contain user content.

## JSZip

- Source: https://github.com/Stuk/jszip
- License: MIT OR GPL-3.0-or-later

OneBoard uses JSZip under its MIT licensing option through DocCloak.Core for Office Open XML packages.

## CFB

- Source: https://github.com/SheetJS/js-cfb
- License: Apache-2.0

Included transitively by DocCloak.Core for legacy document inspection. OneBoard v1.0.0 does not advertise legacy `.doc` export.

## Downloaded ML models and tokenizers

Model weights are not redistributed in OneBoard release packages. When the user explicitly consents, DocCloak.Core downloads a selected model and tokenizer from an immutable, hash-pinned Hugging Face revision and stores them locally. Model repositories retain their own license terms; review those terms in the linked model card before selection. The default GLiNER PII Small model is downloaded, not redistributed by OneBoard.

## Additional dependencies

The complete exact dependency tree is recorded in `package-lock.json` and `src-tauri/Cargo.lock`. Each dependency retains its own copyright and license. The release process rejects declared AGPL, GPL-only, SSPL, non-commercial, research-only, or unknown production dependency licenses. Dual-licensed dependencies are used under their permissive option.
