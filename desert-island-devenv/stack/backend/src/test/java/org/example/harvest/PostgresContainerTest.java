package org.example.harvest;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Starts a real container through Testcontainers (added 2026-10-01, when the team confirmed
 * Docker). Runs only where DEVENV_CONTAINER_TESTS=true -- island/prove-install.sh sets it -- so
 * the bundle build on the staging machine never needs a container runtime. On the island it
 * proves the whole chain: Docker, Ryuk, and ~/.testcontainers.properties rewriting the Docker
 * Hub names (postgres, testcontainers/ryuk) to the Nexus registry.
 */
@EnabledIfEnvironmentVariable(named = "DEVENV_CONTAINER_TESTS", matches = "true")
class PostgresContainerTest {
  @Test
  void postgresStartsFromTheIslandRegistry() throws Exception {
    try (PostgreSQLContainer pg = new PostgreSQLContainer("postgres:18.6")) {
      pg.start();
      try (Connection c = DriverManager.getConnection(pg.getJdbcUrl(), pg.getUsername(), pg.getPassword());
          ResultSet rs = c.createStatement().executeQuery("select version()")) {
        assertThat(rs.next()).isTrue();
        assertThat(rs.getString(1)).startsWith("PostgreSQL 18.6");
      }
    }
  }
}
