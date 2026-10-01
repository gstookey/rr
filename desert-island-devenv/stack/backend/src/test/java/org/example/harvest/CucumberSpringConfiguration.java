package org.example.harvest;

import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Boots the full Spring Boot 4.1 context (JPA on embedded H2, AMQP, Kafka, security, actuator)
 * for the Cucumber scenario -- proof that Boot, Cucumber and the JUnit Platform Boot manages
 * work together on Java 25, not just that they resolve.
 */
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class CucumberSpringConfiguration {}
