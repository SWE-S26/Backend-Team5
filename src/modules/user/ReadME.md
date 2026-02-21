# API Documentation Guide

In any case you have to **change the DTO**, it will reflect on your API documentation given you've referenced the files there.
## Folder Structure Overview

1. **routes**: Registers the route path and path variables, also points to the controller handlers.  
2. **controllers**: Uses services, indicates the data returned (has status codes).  
3. **services**: Contains business logic, uses mappers and repositories to do its work.  
4. **repositories**: Abstracts database operations (write ORM logic here).  
5. **models**: Contains schemas (NO LOGIC, JUST SCHEMA DEFINITIONS).  
6. **dtos folder**: Open it to see its own README.
7. **docs folder**: Open it to see its own README
