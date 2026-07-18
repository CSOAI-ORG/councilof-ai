.PHONY: build install clean test release

BINARY_NAME := meokclaw
BUILD_DIR := ./build
CMD_PATH := ./cmd/meokclaw

# Default build for current platform
build:
	go build -ldflags "-s -w -X main.version=$$(git describe --tags --always 2>/dev/null || echo 'dev')" -o $(BUILD_DIR)/$(BINARY_NAME) $(CMD_PATH)

# Install to $GOPATH/bin
install:
	go install -ldflags "-s -w -X main.version=$$(git describe --tags --always 2>/dev/null || echo 'dev')" $(CMD_PATH)

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)
	rm -f meokclaw-test

# Run tests (placeholder — no tests yet)
test:
	@echo "No tests implemented yet. See RUNDOWN_2026-06-09.md for gap list."

# Build release binaries for multiple platforms
release:
	mkdir -p $(BUILD_DIR)
	# macOS arm64 (Apple Silicon)
	GOOS=darwin GOARCH=arm64 go build -ldflags "-s -w -X main.version=$$(git describe --tags --always 2>/dev/null || echo 'dev')" -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 $(CMD_PATH)
	# macOS amd64 (Intel)
	GOOS=darwin GOARCH=amd64 go build -ldflags "-s -w -X main.version=$$(git describe --tags --always 2>/dev/null || echo 'dev')" -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 $(CMD_PATH)
	# Linux amd64
	GOOS=linux GOARCH=amd64 go build -ldflags "-s -w -X main.version=$$(git describe --tags --always 2>/dev/null || echo 'dev')" -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(CMD_PATH)
	# Linux arm64
	GOOS=linux GOARCH=arm64 go build -ldflags "-s -w -X main.version=$$(git describe --tags --always 2>/dev/null || echo 'dev')" -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 $(CMD_PATH)
	@echo "Release binaries built in $(BUILD_DIR)/"

# Development run
dev:
	go run $(CMD_PATH)

# Verify the binary works
verify: build
	$(BUILD_DIR)/$(BINARY_NAME) --version
	$(BUILD_DIR)/$(BINARY_NAME) --verify-license
