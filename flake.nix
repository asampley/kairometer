{
	description = "UTF-Nate";
	inputs = {
		nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
		flake-utils.url = "github:numtide/flake-utils";
		naersk.url = "github:nmattia/naersk";
		fenix = {
		  url = "github:nix-community/fenix";
		  inputs.nixpkgs.follows = "nixpkgs";
		};
	};
	outputs = { self, nixpkgs, flake-utils, naersk, fenix }:
		let
			supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
			forAllSystems = f: nixpkgs.lib.genAttrs supportedSystems (system: f rec {
				inherit system;

				pkgs = import nixpkgs {
					inherit system;
					config.android_sdk.accept_license = true;
					config.allowUnfree = true;
				};

				androidComposition = pkgs.androidenv.composeAndroidPackages {
					platformVersions = [ "34" "35" ];
					buildToolsVersions = [ "34.0.0" "35.0.1" ];
					systemImageTypes = [ "google_apis_playstore" ];
					abiVersions = [ "armeabi-v7a" "arm64-v8a" ];
					includeNDK = true;
					includeExtras = [ "extras;google;auto" ];
				};

				rustToolchain = fenix.packages.${system}.fromToolchainFile {
					dir = ./src-tauri;
					sha256 = "sha256-X/4ZBHO3iW0fOenQ3foEvscgAPJYl2abspaBThDOukI=";
				};

				nativeBuildInputs = with pkgs; [
					# rust build tools
					rustToolchain

					# node build tools
					nodejs
					pnpm

					# Linux build tools
					pkg-config
					gobject-introspection
					webkitgtk_4_1

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
			});
			manifest = (nixpkgs.lib.importTOML ./Cargo.toml).package;
		in {
			#packages = forAllSystems ({ pkgs, system, nativeBuildInputs, buildInputs }: {
			#	default = pkgs.rustPlatform.buildRustPackage rec {
			#		pname = manifest.name;
			#		version = manifest.version;
			#		cargoLock.lockFile = ./Cargo.lock;
			#		src = pkgs.lib.cleanSource ./.;

			#		inherit nativeBuildInputs buildInputs;
			#	};
			#});

			devShells = forAllSystems (shared: {
				default = with shared.pkgs; mkShell rec {
					#inputsFrom = [ self.packages.${system}.default ];

					nativeBuildInputs = shared.nativeBuildInputs;

					buildInputs = shared.buildInputs ++ [
						clippy
						rust-analyzer
						rustfmt
						svelte-language-server
						typescript-language-server
					];

					WEBKIT_DISABLE_DMABUF_RENDERER = "1";
					GIO_MODULE_DIR = "${shared.pkgs.glib-networking}/lib/gio/modules/";

					## Android build environment
					ANDROID_HOME = "${shared.androidComposition.androidsdk}/libexec/android-sdk";
					NDK_HOME = "${shared.androidComposition.androidsdk}/libexec/android-sdk/ndk/${builtins.head (shared.pkgs.lib.lists.reverseList (builtins.split "-" "${shared.androidComposition.ndk-bundle}"))}";
					ANDROID_SDK_ROOT = "${shared.androidComposition.androidsdk}/libexec/android-sdk";
					ANDROID_NDK_ROOT = "${shared.androidComposition.androidsdk}/libexec/android-sdk/ndk-bundle";

					# override the aapt2 binary that gradle uses with the patched one from the sdk
					GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${shared.androidComposition.androidsdk}/libexec/android-sdk/build-tools/35.0.1/aapt2";
				};
			});
		};
}
