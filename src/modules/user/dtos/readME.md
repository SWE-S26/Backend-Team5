# API Documentation Guide

In any case you have to **change the DTO**, it will reflect on your API documentation given you've referenced the files there.

- `request.params` => params of the request sent as path variables, 
you should look at the `shared/docs/yml/common.parameters.yml`, you'll find the __*id*__ common path variable if you want to reference.
- `request.query` => params of the request sent as query strings, 
you should look at the `shared/docs/yml/common.parameters.yml`, you'll find the __*pagination*__ schema if you want to reference.
- `request.body` => params of the request sent as body (This gets documented as schemas by the variable name)
- `request` => combining all of the above to form your Request
- `response` => object returned
- `mapper` => Turns the interface of the module document to output of the API, used by service layer
