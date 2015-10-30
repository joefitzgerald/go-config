#!/bin/bash

echo "Downloading latest Atom release..."
[ "$TRAVIS_OS_NAME" == "osx" ] && ATOM_DOWNLOAD_URL=https://atom.io/download/mac || ATOM_DOWNLOAD_URL=https://atom.io/download/deb
[ "$TRAVIS_OS_NAME" == "osx" ] && ATOM_DOWNLOAD_FILE=atom.zip || ATOM_DOWNLOAD_FILE=atom.deb

curl -s -L "$ATOM_DOWNLOAD_URL" \
  -H 'Accept: application/octet-stream' \
  -o "$ATOM_DOWNLOAD_FILE"

if [ "$TRAVIS_OS_NAME" == "osx" ]
then
    mkdir atom
    unzip -q atom.zip -d atom
    export PATH=$PWD/atom/Atom.app/Contents/Resources/app/apm/bin:$PATH
    export ATOM_PATH=./atom
    export ATOM_SH=./atom/Atom.app/Contents/Resources/app/atom.sh
    export APM_SH=./atom/Atom.app/Contents/Resources/app/apm/node_modules/.bin/apm
else
    sudo apt-get install gdebi-core
    sudo gdebi -n atom.deb
    export ATOM_SH="atom"
    export APM_SH="apm"
fi


echo "Using Atom version:"
/bin/bash "$ATOM_SH" -v

echo "Downloading package dependencies..."
/bin/bash "$APM_SH" clean
/bin/bash "$APM_SH" install

TEST_PACKAGES="${APM_TEST_PACKAGES:=none}"

if [ "$TEST_PACKAGES" != "none" ]; then
  echo "Installing atom package dependencies..."
  for pack in $TEST_PACKAGES ; do
    /bin/bash "$APM_SH" install $pack
  done
fi

if [ -f ./node_modules/.bin/coffeelint ]; then
  if [ -d ./lib ]; then
    echo "Linting package..."
    ./node_modules/.bin/coffeelint lib
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
  fi
  if [ -d ./spec ]; then
    echo "Linting package specs..."
    ./node_modules/.bin/coffeelint spec
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
  fi
fi

if [ -f ./node_modules/.bin/eslint ]; then
  if [ -d ./lib ]; then
    echo "Linting package..."
    ./node_modules/.bin/eslint lib
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
  fi
  if [ -d ./spec ]; then
    echo "Linting package specs..."
    ./node_modules/.bin/eslint spec
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
  fi
fi

if [ -f ./node_modules/.bin/standard ]; then
  if [ -d ./lib ]; then
    echo "Linting package..."
    ./node_modules/.bin/standard lib/**/*.js
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
  fi
  if [ -d ./spec ]; then
    echo "Linting package specs..."
    ./node_modules/.bin/standard spec/**/*.js
    rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi
  fi
fi

echo "Running specs..."
if [ "$TRAVIS_OS_NAME" == "osx" ]
then
    /bin/bash "$APM_SH" test --path "$ATOM_SH"
else
    apm test
fi
exit
