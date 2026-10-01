// devenv-nexus.init.gradle.kts -- created 2026-10-01. Installed into ~/.gradle/init.d/ by
// install-backend-workstation.sh. Replaces EVERY repository a build declares (settings,
// plugin management, project and buildscript) with the Nexus maven-hosted repository.
// Why replace instead of add: Gradle treats an unreachable repository as a build failure, it
// does not fall through to the next one -- a leftover mavenCentral() breaks the build offline.
val devenvNexus = "__NEXUS_MAVEN_URL__"

fun org.gradle.api.artifacts.dsl.RepositoryHandler.onlyNexus() {
    clear()
    maven {
        name = "devenvNexus"
        url = uri(devenvNexus)
        isAllowInsecureProtocol = devenvNexus.startsWith("http://")
    }
}

beforeSettings { pluginManagement.repositories.onlyNexus() }
settingsEvaluated {
    pluginManagement.repositories.onlyNexus()
    dependencyResolutionManagement.repositories.onlyNexus()
}
allprojects {
    buildscript.repositories.onlyNexus()
    afterEvaluate { if (repositories.isNotEmpty()) repositories.onlyNexus() }
}
