# Vuliz

A simple vulnerability visualizer for your dependencies. Vuliz creates an interactive network visualization of your project's dependency tree, highlighting known security vulnerabilities to help you identify and address potential security risks.

## 🎥 Demo

See Vuliz in action at [https://vuliz.alatas.dev](https://vuliz.alatas.dev)

## ✨ Features

- **Interactive Dependency Visualization**: Explore your dependency tree through an intuitive network graph
- **Vulnerability Detection**: Automatically identifies known security vulnerabilities in your dependencies
- **Level-based Network View**: Visualizes dependencies hierarchically, making it easy to understand the relationship between packages
- **Real-time Processing**: Upload your package file and instantly see the vulnerability analysis

## 🚀 Supported Package Managers

### Currently Supported
- **Python** (pip) - `requirements.txt` files
- **Gradle** - JVM languages (Java, Kotlin, Scala) - `build.gradle`, `build.gradle.kts` and `gradle.lockfile` files

  Transitive dependencies come from the [deps.dev](https://deps.dev) API. Build scripts are read without running Gradle, so dependencies from version catalogs (`libs.*`) and versions computed at build time are not picked up. A `gradle.lockfile` (enable [dependency locking](https://docs.gradle.org/current/userguide/dependency_locking.html), then run `./gradlew dependencies --write-locks`) gives the most accurate result, since it lists every resolved version.
- **Node.js** (npm) - JavaScript/TypeScript packages - `package.json`, `package-lock.json` and `npm-shrinkwrap.json` files

  Transitive dependencies come from the [deps.dev](https://deps.dev) API. `package.json` lists version ranges, so the lowest version of each range is used (e.g. `1.2.3` for `^1.2.3`); a `package-lock.json` gives the exact installed versions. Yarn and pnpm lock files are not supported yet.

## 🔍 Vulnerability Sources

- **Sonatype OSS Index** (default)
- **Google OSV** ([osv.dev](https://osv.dev)). It needs no authentication, so requests go straight from your browser without the proxy.

Choose the source at build time with the `VULNERABILITY_PROVIDER` environment variable (`sonatype` or `osv`):

```bash
VULNERABILITY_PROVIDER=osv npm run build
```

## 🏗️ Architecture

Vuliz was originally designed to run entirely in the browser for maximum privacy and convenience. However, due to Sonatype's vulnerability API introducing authentication requirements, vulnerability requests now pass through an authentication proxy to handle secure API access.

The authentication proxy is open source and available at: [https://github.com/enes-alatas/authru](https://github.com/enes-alatas/authru)

This architecture ensures that your package files are still processed locally in your browser, while only the vulnerability checks are proxied through the authentication service. With the OSV source, no proxy is involved.

## 🛠️ Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
npm run start
```

### Build

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## 🤝 Contributing

Contributions are **very welcome**! We're especially interested in:

- **Extending package manager support** (Node.js, Gradle, Maven, Cargo, etc.)
- **Adding new vulnerability data sources**
- **Improving visualization features**
- **Bug fixes and performance improvements**
- **Documentation enhancements**

Please feel free to open issues for bugs, feature requests, or questions. Pull requests are greatly appreciated!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Show Your Support

If you find this project helpful, please consider giving it a star on GitHub!
