# Updating the website

The English templates in `_src/pages` are the source for all languages. Edit the template once. Use the root-relative site structure when adding links, expressed relative to the English template that contains them. The build rewrites each link for its language and directory depth.

Run `python3 _src/build.py --extract` from the repository root after editing the copy. Translate the new entries from `i18n/en.json` in `i18n/it.json` and `i18n/es.json`. Preserve product names and the English labels people see on the device. Then run `python3 _src/build.py` and commit the generated pages with the source. The build stops and lists any missing translations before writing pages.

The site serves static HTML. English opens at the root, Italiano under `it/`, and Español under `es/`. Visitors can share any page directly. The header switcher maps each page to its translations. Artwork, typefaces, and CSS are shared. For another language, add its name, flag and switcher label in the generator, add the theme labels in `theme.js`, and supply its dictionary.
