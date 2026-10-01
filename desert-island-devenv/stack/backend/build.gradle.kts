// Back-end harvest build -- created 2026-10-01. Based on the start.spring.io template for
// Boot 4.1.1 / Java 25 / Gradle 9.7.1, plus every library and tool on the architect's list.
// Starters marked ADDED-IN-VETTING are implied by the listed infrastructure (Postgres, RabbitMQ,
// Kafka, Keycloak) but were not named -- confirm with the architect.
plugins {
    java
    checkstyle
    pmd
    jacoco
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.spotless)
    alias(libs.plugins.freefair.lombok)
}

group = "org.example"
version = "0.0.1"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(libs.versions.java.get().toInt()) }
}

// Testcontainers is BOM-managed; restating the property keeps the correction visible.
extra["testcontainers.version"] = libs.versions.testcontainers.get()

lombok { version = libs.versions.lombok.get() }

dependencies {
    // --- ADDED-IN-VETTING starters (implied by Postgres / RabbitMQ / Kafka / Keycloak) ---
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.boot:spring-boot-starter-kafka")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-h2console")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("com.h2database:h2")

    // --- architect's libraries ---
    implementation(libs.logstash.logback.encoder)
    implementation(platform(libs.jackson2.bom))
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation(libs.jakarta.xml.bind.api)
    implementation(libs.threeten.extra)
    implementation(libs.commons.math3)
    implementation(libs.commons.lang3)

    // --- tests ---
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
    testImplementation("org.springframework.boot:spring-boot-starter-amqp-test")
    testImplementation("org.springframework.boot:spring-boot-starter-kafka-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:testcontainers-junit-jupiter")
    testImplementation("org.testcontainers:testcontainers-postgresql")
    testImplementation("org.testcontainers:testcontainers-rabbitmq")
    testImplementation("org.testcontainers:testcontainers-kafka")
    testImplementation("org.testcontainers:testcontainers-mockserver")
    testImplementation("org.testcontainers:testcontainers-selenium")
    // ADDED-IN-VETTING: the selenium and mockserver Testcontainers modules declare their client
    // libraries as provided -- without these, a test using either module cannot resolve offline.
    testImplementation("org.seleniumhq.selenium:selenium-remote-driver")   // BOM-managed
    testImplementation(libs.mockserver.client)
    testImplementation(platform(libs.cucumber.bom))
    testImplementation("io.cucumber:cucumber-java")
    testImplementation("io.cucumber:cucumber-spring")
    testImplementation("io.cucumber:cucumber-junit-platform-engine")
    testImplementation("org.junit.platform:junit-platform-suite")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// The architect's exact H2 pin differs from the BOM's; harvest it too so either choice
// resolves on the island. Not used by the build.
val harvestArchitectPins: Configuration by configurations.creating
dependencies { harvestArchitectPins(libs.h2.architect) }

checkstyle {
    toolVersion = libs.versions.checkstyle.get()
    isIgnoreFailures = true
}
pmd {
    toolVersion = libs.versions.pmd.get()
    isConsoleOutput = false
    isIgnoreFailures = true
    ruleSets = listOf("category/java/bestpractices.xml")
}
jacoco { toolVersion = libs.versions.jacoco.get() }

spotless {
    java {
        target("src/**/*.java")
        googleJavaFormat()
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}
tasks.jacocoTestReport { reports { xml.required = true } }

// Resolve every resolvable configuration, so nothing that a later task would fetch lazily is
// missed by the bundle (the build tasks below cover the lazy tool configurations).
tasks.register("resolveAll") {
    doLast {
        configurations.filter { it.isCanBeResolved }.forEach { c ->
            c.incoming.artifactView { lenient(false) }.files.files
        }
    }
}
