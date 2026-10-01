---
title:      Back End Tech Stack for RR Dev Environment
notes:      This is a list from one of the architects on my team for the requested back end tech stack they will be porting
            onto the new isolated / air-gapped network. 
updated:    2026-10-01
---
## Back End Tech Stack from Architect on My Team
```txt
Back End Tech Stack for RR Effort

-- Software --
(x) Java 25
(x) Eclipse IDE 4.41
(x) Postgres 18.6
(x) Gradle 9.7.1
(x) SpringBoot 4.1.1
(x) TestContainers 1.20.1
    -- Postgres 1.20.1
    -- RabbitMQ 1.20.1
    -- kafka 1.20.1
    -- mock service 1.20.1
    -- selenium 1.20.1
(x) Appache Commons 3.6.1
(x) Checkstyle 14.1.0
(x) PMD 7.27.0
(x) Spotless 8.10.2
(x) Cucumber 7.34.7
(x) Cucumber for java 7.34.7
(x) logstash logback encoder 0.0
(x) lombok gradle plugin 9.5.0
(x) lombok 9.5.0
(x) jackson fasterxml 2.21
(x) H2 database 2.3
(x) jacoco maven plugin 0.8.12
(x) jakarta xml bind api 4.0.5
(x) threeten-extra 1.8.0

-- Tools --
(x) Helm 4.0.5
(x) kubectl 5.0.4
(x) jq 1.6

-- Images --
(x) Java 25 Temurin Image
(x) Postgres 18.6 Image
(x) Pgadmin 9.17 Image
(x) RabbitMQ 4.3.5 Image
(x) Ryuk 0.9.0 TestContainers Image
```