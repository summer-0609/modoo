const pkg = require("package-json");
const got = require("got");
const showProgress = require("crimson-progressbar");

pkg("@modoo/modoo-script", {
  fullMetadata: true,
  registryUrl: "http://47.116.3.37:4873/"
}).then(metadata => {
  const {
    dist: { tarball },
    version,
    keywords
  } = metadata;

  return {
    tarball,
    version,
    keywords,
    name: boilerplate
  };
});

// function getBoilerplateMeta(boilerplate) {
//   return pkg(boilerplate, { fullMetadata: true })
//     .then(metadata => {
//       const {
//         dist: { tarball },
//         version,
//         keywords
//       } = metadata;
//       return {
//         tarball,
//         version,
//         keywords,
//         name: boilerplate
//       };
//     })
//     .catch(() => {
//       return { name: boilerplate };
//     });
// }
