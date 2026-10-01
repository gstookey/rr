package org.example.harvest;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class GreetingTest {
  @Test
  void lombokAndThreetenWork() {
    Greeting g = new Greeting("hi");
    assertThat(g.getText()).isEqualTo("hi");
    assertThat(g.quarter(LocalDate.of(2026, 10, 1))).isEqualTo("2026-Q4");
  }
}
