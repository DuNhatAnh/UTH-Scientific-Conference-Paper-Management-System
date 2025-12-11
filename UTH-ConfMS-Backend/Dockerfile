# Giai đoạn Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy file csproj và restore (Copy đúng cấu trúc lớp)
COPY ["UTHConfMS.API/UTHConfMS.API.csproj", "UTHConfMS.API/"]
COPY ["UTHConfMS.Core/UTHConfMS.Core.csproj", "UTHConfMS.Core/"]
COPY ["UTHConfMS.Infra/UTHConfMS.Infra.csproj", "UTHConfMS.Infra/"]

RUN dotnet restore "UTHConfMS.API/UTHConfMS.API.csproj"

# Copy toàn bộ source code còn lại
COPY . .
WORKDIR "/src/UTHConfMS.API"
RUN dotnet build "UTHConfMS.API.csproj" -c Release -o /app/build

# Giai đoạn Publish
FROM build AS publish
RUN dotnet publish "UTHConfMS.API.csproj" -c Release -o /app/publish

# Giai đoạn Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "UTHConfMS.API.dll"]