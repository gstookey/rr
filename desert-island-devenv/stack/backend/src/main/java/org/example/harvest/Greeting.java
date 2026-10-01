package org.example.harvest;

import java.time.LocalDate;
import lombok.Value;
import org.threeten.extra.YearQuarter;

/** Exercises Lombok and threeten-extra so annotation processing and the classpath are proven. */
@Value
public class Greeting {
  String text;

  public String quarter(LocalDate date) {
    return YearQuarter.from(date).toString();
  }
}
