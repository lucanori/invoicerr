target "docker-metadata-action" {}

variable "APP" {
  default = "invoicerr"
}

variable "VERSION" {
  default = "latest"
}

variable "NODE_VERSION" {
  default = "22"
}

variable "SOURCE" {
  default = "https://github.com/Impre-visible/invoicerr"
}

variable "REGISTRY" {
  default = "ghcr.io/impre-visible"
}

group "default" {
  targets = ["image-local"]
}

target "base" {
  dockerfile = "Dockerfile"
  context = "."
  args = {
    NODE_VERSION = "${NODE_VERSION}"
    BUILD_ENV = "production"
  }
  labels = {
    "org.opencontainers.image.source" = "${SOURCE}"
    "org.opencontainers.image.title" = "Invoicerr"
    "org.opencontainers.image.description" = "Modern open-source invoicing application for freelancers and small businesses"
    "org.opencontainers.image.vendor" = "Impre-visible"
    "org.opencontainers.image.licenses" = "UNLICENSED"
    "org.opencontainers.image.url" = "${SOURCE}"
    "org.opencontainers.image.documentation" = "${SOURCE}#readme"
  }
}

target "image-local" {
  inherits = ["base"]
  output = ["type=docker"]
  tags = ["${APP}:${VERSION}", "${APP}:local"]
  cache-from = [
    "type=gha,scope=local"
  ]
  cache-to = [
    "type=gha,mode=max,scope=local"
  ]
}

target "image" {
  inherits = ["base", "docker-metadata-action"]
  cache-from = [
    "type=gha,scope=main"
  ]
  cache-to = [
    "type=gha,mode=max,scope=main"
  ]
}

target "image-all" {
  inherits = ["image"]
  platforms = [
    "linux/amd64",
    "linux/arm64"
  ]
  output = ["type=registry"]
}

target "image-push" {
  inherits = ["image"]
  output = ["type=registry"]
  tags = [
    "${REGISTRY}/${APP}:${VERSION}",
    "${REGISTRY}/${APP}:latest"
  ]
}

target "security-scan" {
  inherits = ["image-local"]
  output = ["type=cacheonly"]
  cache-from = [
    "type=gha,scope=security"
  ]
  cache-to = [
    "type=gha,mode=max,scope=security"
  ]
} 