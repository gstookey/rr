package org.example.harvest;

import static org.assertj.core.api.Assertions.assertThat;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;

public class GreetingSteps {
  private Greeting greeting;

  @Given("a greeting of {string}")
  public void aGreetingOf(String text) {
    greeting = new Greeting(text);
  }

  @Then("its text is {string}")
  public void itsTextIs(String text) {
    assertThat(greeting.getText()).isEqualTo(text);
  }
}
