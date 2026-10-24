# Canonical licence texts

The fallback for a package that ships no licence file of its own. The third-party notices
generator (`scripts/third-party-notices.ts`) uses one of these only when a package names a
licence and carries no file holding its text; ten Rust crates in `tabiya.exe` did at phase
50. It never uses one to replace a file a package does carry.

Only the texts the fallback needs are here. A licence the fallback reaches that is not in
this folder fails the build, naming the package, so the fix is to add its text here.

Each file is SPDX's own plain-text copy, unedited, fetched on 2026-10-24 from SPDX's
`license-list-data` repository, the data behind the licence pages on spdx.org. The plain
copies are used rather than the `.txt` files on spdx.org itself because those carry SPDX
template markup in places (`<<var;name=copyright;...>>` in BSD-3-Clause); the words are
otherwise the same.

| File | Licence page | Text fetched from |
|---|---|---|
| `MIT.txt` | https://spdx.org/licenses/MIT.html | https://raw.githubusercontent.com/spdx/license-list-data/main/text/MIT.txt |
| `Apache-2.0.txt` | https://spdx.org/licenses/Apache-2.0.html | https://raw.githubusercontent.com/spdx/license-list-data/main/text/Apache-2.0.txt |
| `BSD-3-Clause.txt` | https://spdx.org/licenses/BSD-3-Clause.html | https://raw.githubusercontent.com/spdx/license-list-data/main/text/BSD-3-Clause.txt |
| `MPL-2.0.txt` | https://spdx.org/licenses/MPL-2.0.html | https://raw.githubusercontent.com/spdx/license-list-data/main/text/MPL-2.0.txt |

Where a text has a copyright line (`Copyright (c) <year> <copyright holders>` in MIT,
`Copyright (c) <year> <owner>.` in BSD-3-Clause), the generator fills it from the
package's `authors`, or its name and repository when that is empty, and says in the
notices that it did. Apache-2.0 and MPL-2.0 carry no copyright line of their own.
