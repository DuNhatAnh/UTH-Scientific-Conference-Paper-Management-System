FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["UTH.ApiGateway.csproj", "./"]
RUN dotnet restore "UTH.ApiGateway.csproj"
COPY . .
RUN dotnet publish "UTH.ApiGateway.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "UTH.ApiGateway.dll"]