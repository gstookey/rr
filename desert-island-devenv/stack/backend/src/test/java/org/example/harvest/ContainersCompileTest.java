package org.example.harvest;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.mockserver.client.MockServerClient;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.rabbitmq.RabbitMQContainer;

/**
 * Compiles against the Testcontainers 2.x module APIs without starting containers (the harvest
 * must not need a container runtime). Proves the 2.x package names, which differ from 1.x.
 */
class ContainersCompileTest {
  @Test
  void testcontainersTwoApisAreOnTheClasspath() {
    assertThat(PostgreSQLContainer.class).isNotNull();
    assertThat(RabbitMQContainer.class).isNotNull();
    assertThat(KafkaContainer.class).isNotNull();
    // the client libraries the selenium / mockserver modules expect the test to provide
    assertThat(MockServerClient.class).isNotNull();
    assertThat(RemoteWebDriver.class).isNotNull();
  }
}
