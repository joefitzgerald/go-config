# Go Runtime [![Build Status](https://travis-ci.org/joefitzgerald/go-runtime.svg)](https://travis-ci.org/joefitzgerald/go-runtime) [![Build status](https://ci.appveyor.com/api/projects/status/vpk2497en2e64lpa?svg=true)](https://ci.appveyor.com/project/joefitzgerald/go-runtime)

Go runtime detects installed go runtime(s). You can optionally configure the package to provide hints for go installations and associated tools.

This package provides an API via an Atom service. This API can be used by other packages that need to work with the `go` tool, other related tools (e.g. `gofmt`, `vet`, etc.) or `$GOPATH/bin` tools (e.g. `goimports`, `goreturns`, etc.).
