{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05";
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.corepack_20
  ];
  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "dracula-theme.theme-dracula"
    ];
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          # Use pnpm and correct Next.js 15 flag --hostname
          command = [ "pnpm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          manager = "web";
        };
      };
    };
    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Install dependencies using pnpm
        install = "corepack enable && pnpm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Optional: any background watch tasks
      };
    };
  };
}
