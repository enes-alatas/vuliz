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

### Under Development
- **Node.js** (npm/yarn) - JavaScript/TypeScript packages 🚧

### Planned
- **Gradle** - JVM languages (Java, Kotlin, Scala)
- **Google OSV** (Open Source Vulnerabilities) database support

## 🏗️ Architecture

Vuliz was originally designed to run entirely in the browser for maximum privacy and convenience. However, due to Sonatype's vulnerability API introducing authentication requirements, vulnerability requests now pass through an authentication proxy to handle secure API access.

The authentication proxy is open source and available at: [https://github.com/enes-alatas/authru](https://github.com/enes-alatas/authru)

This architecture ensures that your package files are still processed locally in your browser, while only the vulnerability checks are proxied through the authentication service.

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
