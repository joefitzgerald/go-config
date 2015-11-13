# go-config For Atom [![Build Status](https://travis-ci.org/joefitzgerald/go-config.svg)](https://travis-ci.org/joefitzgerald/go-config) [![Build status](https://ci.appveyor.com/api/projects/status/vpk2497en2e64lpa?svg=true)](https://ci.appveyor.com/project/joefitzgerald/go-config)

`go-config` detects your go installation(s), tool(s), and associated configuration. You can optionally configure the package to provide hints for go installations tools.

This package provides an API via an Atom service. This API can be used by other packages that need to work with the `go` tool, other related tools (e.g. `gofmt`, `vet`, etc.) or `$GOPATH/bin` tools (e.g. `goimports`, `goreturns`, etc.).
