(Remove-Item ".\node_modules\unipept-web-components" -Recurse) 2> $null

# Use 'chocolatey install jq' to install jq on Windows
npm install --no-save @(Get-Content -Path "./../unipept-web-components/package.json" | jq ".dependencies" | Select-String -Pattern "^[{|}]" -NotMatch | ForEach-Object {
   $_.Line.split(":")[0] | %{$_ -replace '"| ', ''}
})

# Symlink the web components on Windows
New-Item -ItemType "directory" -Path ".\node_modules\unipept-web-components"
New-Item -ItemType "symboliclink" -Path ".\node_modules\unipept-web-components\src" -value ".\..\unipept-web-components\src"
New-Item -ItemType "symboliclink" -Path ".\node_modules\unipept-web-components\package.json" -value ".\..\unipept-web-components\package.json"
