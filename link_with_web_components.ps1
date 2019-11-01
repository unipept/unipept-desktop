# Symlink the web components on Windows
New-Item -ItemType "directory" -Path ".\node_modules\unipept-web-components"
New-Item -ItemType "symboliclink" -Path ".\node_modules\unipept-web-components\src" -value ".\..\unipept-web-components\src"
New-Item -ItemType "symboliclink" -Path ".\node_modules\unipept-web-components\package.json" -value ".\..\unipept-web-components\package.json"
