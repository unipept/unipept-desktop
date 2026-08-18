# Unipept Desktop

> [!WARNING]
> **The Unipept Desktop application is deprecated.**
> The app still works, but will no longer receive updates or new features. All
> functionality previously unique to the desktop app has been migrated to the
> [Unipept web application](https://unipept.ugent.be), which we recommend using going
> forward.

This repository stays online so that existing installations keep working and the source
code remains available, but it is no longer actively developed. Open issues and pull
requests are not being worked on, and no further releases are planned.

Unipept Desktop was a desktop companion to [unipept.ugent.be](https://unipept.ugent.be),
aimed at high-throughput analysis of metaproteomics samples. It added local project
management, reference databases built on your own machine, and analyses that did not
depend on our servers.

## Use the web application instead

The [metaproteomics analysis page](https://unipept.ugent.be/mpa) covers the workflow the
desktop app was built for:

| In the desktop app | On the web |
| --- | --- |
| Single assay analysis | the **Single** tab of an analysis |
| Comparative analysis | the **Compare** tab |
| Choosing a reference database | the **Database** tab |
| Exporting results | the **Export** tab |

Unipept 6.0 also brought support for non-tryptic peptides and the Peptonizer pipeline,
neither of which the desktop app ever had.

## If you still need the desktop app

* **Downloads** for Windows, macOS and Linux are on the
  [releases page](https://github.com/unipept/unipept-desktop/releases). The last release
  is [v2.0.2](https://github.com/unipept/unipept-desktop/releases/tag/v2.0.2), from
  August 2024.
* **Documentation** remains available at
  [unipept.ugent.be/desktop](https://unipept.ugent.be/desktop).

## Building from source

Kept for reference. The project is built with Yarn, Vue CLI and
`vue-cli-plugin-electron-builder`; the release workflows in `.github/workflows` run
`yarn install` followed by `yarn run electron:publish`.

```bash
yarn install          # install dependencies
yarn electron:serve   # run the app in development mode
yarn electron:build   # produce a distributable build
yarn lint             # lint and autofix
```

## Citing Unipept Desktop

> Verschaffelt, P., Van Den Bossche, T., Martens, L., Dawyndt, P., & Mesuere, B. (2021).
> Unipept Desktop: A Faster, More Powerful Metaproteomics Results Analysis Tool.
> *Journal of Proteome Research*, 20(4), 2005–2009.
> [doi:10.1021/acs.jproteome.0c00855](https://doi.org/10.1021/acs.jproteome.0c00855)

Machine-readable metadata is in [CITATION.cff](CITATION.cff).

## License

MIT, see [LICENSE](LICENSE).
