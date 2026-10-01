// Harvest project settings -- created 2026-10-01. On the CONNECTED staging machine these
// repositories are the public ones; on the island, the init script shipped in the bundle
// (island/gradle/init.d/nexus.init.gradle.kts) redirects every repository to Nexus.
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}
dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}
rootProject.name = "devenv-backend-harvest"
