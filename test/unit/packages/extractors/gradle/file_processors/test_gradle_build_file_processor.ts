import {GradleBuildFileProcessor} from 'src/packages/extractors/gradle/file_processors/gradle_build_file_processor';
import {LATEST_VERSION, PackageType} from 'src/packages/types';

describe('GradleBuildFileProcessor', () => {
  let processor: GradleBuildFileProcessor;

  beforeEach(() => {
    processor = new GradleBuildFileProcessor();
  });

  // Runs both parsing steps, as parsePackages does after reading the file
  const parse = async (content: string) =>
    await processor['parseEntries'](await processor['parseRawData'](content));

  const maven = (name: string, version: string) => ({
    name,
    version,
    type: PackageType.MAVEN,
  });

  describe('Groovy DSL', () => {
    it('should parse string notation with different configurations', async () => {
      const result = await parse(`
        plugins { id 'java' }
        dependencies {
          implementation 'com.google.guava:guava:31.1-jre'
          api "org.apache.commons:commons-lang3:3.12.0"
          testImplementation('junit:junit:4.13.2')
          runtimeOnly group: 'org.postgresql', name: 'postgresql', version: '42.6.0'
        }
      `);
      expect(result).toEqual([
        maven('com.google.guava:guava', '31.1-jre'),
        maven('org.apache.commons:commons-lang3', '3.12.0'),
        maven('junit:junit', '4.13.2'),
        maven('org.postgresql:postgresql', '42.6.0'),
      ]);
    });

    it('should substitute variables from ext and def', async () => {
      const result = await parse(`
        ext {
          springVersion = '5.3.20'
        }
        ext.jacksonVersion = "2.15.2"
        def slf4jVersion = '2.0.7'
        dependencies {
          implementation "org.springframework:spring-core:$springVersion"
          implementation "com.fasterxml.jackson.core:jackson-databind:\${jacksonVersion}"
          implementation "org.slf4j:slf4j-api:\${rootProject.ext.slf4jVersion}"
          implementation group: 'org.slf4j', name: 'slf4j-simple', version: slf4jVersion
        }
      `);
      expect(result).toEqual([
        maven('org.springframework:spring-core', '5.3.20'),
        maven('com.fasterxml.jackson.core:jackson-databind', '2.15.2'),
        maven('org.slf4j:slf4j-api', '2.0.7'),
        maven('org.slf4j:slf4j-simple', '2.0.7'),
      ]);
    });

    it('should report unresolved, dynamic and missing versions as latest', async () => {
      const result = await parse(`
        dependencies {
          implementation "org.example:unknown:$undefinedVersion"
          implementation 'org.example:dynamic:1.+'
          implementation 'org.example:range:[1.0,2.0)'
          implementation 'org.example:latest:latest.release'
          implementation 'org.example:managed'
        }
      `);
      expect(result).toEqual([
        maven('org.example:unknown', LATEST_VERSION),
        maven('org.example:dynamic', LATEST_VERSION),
        maven('org.example:range', LATEST_VERSION),
        maven('org.example:latest', LATEST_VERSION),
        maven('org.example:managed', LATEST_VERSION),
      ]);
    });

    it('should strip classifiers and artifact extensions', async () => {
      const result = await parse(`
        dependencies {
          implementation 'io.netty:netty-transport-native-epoll:4.1.94.Final:linux-x86_64'
          implementation 'com.example:widget:1.0.0@aar'
        }
      `);
      expect(result).toEqual([
        maven('io.netty:netty-transport-native-epoll', '4.1.94.Final'),
        maven('com.example:widget', '1.0.0'),
      ]);
    });

    it('should ignore comments, project dependencies, files and excludes', async () => {
      const result = await parse(`
        dependencies {
          // implementation 'commented:out:1.0'
          /* implementation 'block:comment:1.0' */
          implementation project(':core')
          implementation files('libs/local.jar')
          implementation('org.hibernate:hibernate-core:5.6.15.Final') {
            exclude group: 'org.jboss', module: 'jandex'
          }
        }
      `);
      expect(result).toEqual([
        maven('org.hibernate:hibernate-core', '5.6.15.Final'),
      ]);
    });

    it('should ignore the buildscript classpath and dependency constraints', async () => {
      const result = await parse(`
        buildscript {
          dependencies {
            classpath 'com.android.tools.build:gradle:8.1.0'
          }
        }
        dependencies {
          implementation 'com.squareup.okhttp3:okhttp:4.11.0'
          constraints {
            implementation 'com.squareup.okio:okio:3.4.0'
          }
        }
      `);
      expect(result).toEqual([maven('com.squareup.okhttp3:okhttp', '4.11.0')]);
    });

    it('should keep strings with comment markers and braces intact', async () => {
      const result = await parse(`
        repositories { maven { url 'https://repo.example.com/maven2' } }
        dependencies {
          implementation 'com.example:braces:1.0' // a "}" in a comment
          implementation "com.example:interpolated:\${'1.1'}"
          implementation 'com.example:after:2.0'
        }
      `);
      expect(result).toContainEqual(maven('com.example:braces', '1.0'));
      expect(result).toContainEqual(maven('com.example:after', '2.0'));
    });

    it('should collect dependencies from several blocks', async () => {
      const result = await parse(`
        subprojects {
          dependencies { implementation 'org.example:a:1.0' }
        }
        dependencies { implementation 'org.example:b:2.0' }
      `);
      expect(result).toEqual([
        maven('org.example:a', '1.0'),
        maven('org.example:b', '2.0'),
      ]);
    });
  });

  describe('Kotlin DSL', () => {
    it('should parse string and map notation', async () => {
      const result = await parse(`
        val ktorVersion = "2.3.4"
        val logbackVersion by extra("1.4.11")
        extra["exposedVersion"] = "0.44.0"
        dependencies {
          implementation("io.ktor:ktor-server-core:$ktorVersion")
          implementation("ch.qos.logback:logback-classic:\${logbackVersion}")
          implementation("org.jetbrains.exposed:exposed-core:\${property("exposedVersion")}")
          implementation(group = "org.jetbrains.exposed", name = "exposed-dao", version = "0.44.0")
          implementation(libs.kotlinx.coroutines)
          implementation(kotlin("stdlib"))
          testImplementation(platform("org.junit:junit-bom:5.10.0"))
        }
      `);
      expect(result).toEqual([
        maven('io.ktor:ktor-server-core', '2.3.4'),
        maven('ch.qos.logback:logback-classic', '1.4.11'),
        // Function calls inside the version are not evaluated
        maven('org.jetbrains.exposed:exposed-core', LATEST_VERSION),
        maven('org.junit:junit-bom', '5.10.0'),
        maven('org.jetbrains.exposed:exposed-dao', '0.44.0'),
      ]);
    });

    it('should strip the strict version marker', async () => {
      const result = await parse(`
        dependencies {
          implementation("org.example:strict:1.2.3!!")
        }
      `);
      expect(result).toEqual([maven('org.example:strict', '1.2.3')]);
    });
  });

  it('should return an empty array without dependencies', async () => {
    expect(await parse("plugins { id 'java' }")).toEqual([]);
    expect(await parse('')).toEqual([]);
  });
});
