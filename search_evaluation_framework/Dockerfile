FROM maven:3.9.9-amazoncorretto-21-al2023

RUN yum install -y git
RUN git clone https://github.com/o19s/opensearch-search-quality-evaluation.git
RUN mvn clean install -f ./opensearch-search-quality-evaluation/pom.xml

RUN mkdir /app
RUN cp ./opensearch-search-quality-evaluation/target/search-evaluation-framework.jar /app/search-evaluation-framework.jar
