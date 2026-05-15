{
  description = "App for weather alerts";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-parts.url = "github:hercules-ci/flake-parts";
  };
  outputs = inputs@{ self, nixpkgs, fenix, flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } ({ ... }: {
      systems = [ "x86_64-linux" "aarch64-linux" ];
      perSystem = { lib, system, ... }:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.android_sdk.accept_license = true;
            config.allowUnfree = true;
          };

          androidComposition = pkgs.androidenv.composeAndroidPackages {
            platformVersions = [ "35" "36" ];
            buildToolsVersions = [ "35.0.0" "36.0.0" ];
            systemImageTypes = [ "google_apis_playstore" ];
            abiVersions = [ "armeabi-v7a" "arm64-v8a" ];
            includeNDK = true;
            includeExtras = [ "extras;google;auto" ];
          };

          rustToolchain = with fenix.packages.${system}; combine ([
            stable.cargo
            stable.clippy
            stable.rustc
            stable.rust-src
            stable.rustfmt
          ]
          ++ map (
            target:
            fenix.packages.${system}.targets.${target}.stable.rust-std
          ) [
            "aarch64-linux-android"
            "armv7-linux-androideabi"
            "i686-linux-android"
            "x86_64-linux-android"
            "x86_64-unknown-linux-gnu"
          ]);

          nativeBuildInputs = with pkgs; [
            # rust build tools
            rustToolchain

            # node build tools
            nodejs

            # Linux build tools
            pkg-config
            gobject-introspection
            webkitgtk_4_1
            wrapGAppsHook4

            # Android build tools
            androidComposition.androidsdk
            jdk_headless

            # AppImage build tools
          ];

          buildInputs = with pkgs; [
            at-spi2-atk
            atkmm
            cairo
            gdk-pixbuf
            glib
            glib-networking
            gtk3
            harfbuzz
            librsvg
            libsoup_3
            pango
            webkitgtk_4_1
            openssl
          ];
          manifest = (lib.importTOML src-tauri/Cargo.toml).package;
        in {
        packages = {
          web = pkgs.buildNpmPackage (finalAttrs: {
            pname = manifest.name + "-web";
            version = manifest.version;

            npmDeps = pkgs.importNpmLock {
              npmRoot = ./.;
            };

            npmConfigHook = pkgs.importNpmLock.npmConfigHook;

            nativeBuildInputs = with pkgs.pkgsBuildHost; [
              librsvg
            ];

            installPhase = ''
              cp -r build $out
            '';

            src = ./.;
          });
          #default = pkgs.rustPlatform.buildRustPackage rec {
          #  pname = manifest.name;
          #  version = manifest.version;
          #  cargoLock.lockFile = ./Cargo.lock;
          #  src = pkgs.lib.cleanSource ./.;

          #  inherit nativeBuildInputs buildInputs;
          #};
        };

        devShells = {
          default = with pkgs; mkShell {
            npmDeps = importNpmLock.buildNodeModules {
              npmRoot = ./.;
              nodejs = nodejs;
            };

            #inputsFrom = [ self.packages.${system}.default ];

            nativeBuildInputs = with pkgs.pkgsBuildHost; nativeBuildInputs ++ [
              importNpmLock.hooks.linkNodeModulesHook
            ];

            buildInputs = buildInputs ++ [
              clippy
              rust-analyzer
              rustfmt
              svelte-language-server
              typescript-language-server
              jmtpfs
            ];

            WEBKIT_DISABLE_DMABUF_RENDERER = "1";
            #XDG_DATA_DIRS = "${gsettings-desktop-schemas}/share/gsettings-schemas/${gsettings-desktop-schemas.name}:${gtk3}/share/gsettings-schemas/${gtk3.name}:$XDG_DATA_DIRS";
            GIO_MODULE_DIR = "${pkgs.glib-networking}/lib/gio/modules/";

            ## Android build environment
            ANDROID_HOME = "${androidComposition.androidsdk}/libexec/android-sdk";
            NDK_HOME = "${androidComposition.androidsdk}/libexec/android-sdk/ndk/${builtins.head (pkgs.lib.lists.reverseList (builtins.split "-" "${androidComposition.ndk-bundle}"))}";
            ANDROID_SDK_ROOT = "${androidComposition.androidsdk}/libexec/android-sdk";
            ANDROID_NDK_ROOT = "${androidComposition.androidsdk}/libexec/android-sdk/ndk-bundle";

            # override the aapt2 binary that gradle uses with the patched one from the sdk
            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidComposition.androidsdk}/libexec/android-sdk/build-tools/36.0.0/aapt2";
          };
        };
      };
    });
}
