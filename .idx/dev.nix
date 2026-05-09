{ pkgs }: {
  # Channel for reproducible environment
  channel = "stable-24.11"; 

  # Combined System Tools
  packages = [
    pkgs.nodejs_22        # Sticking with 22 as requested earlier
    pkgs.pnpm
    pkgs.zulu             # For Java/Emulators
    pkgs.firebase-tools   # Moved here to resolve duplication
  ];

  # IDX-specific configuration
  idx = {
    extensions = [ "mtxr.sqltools" ];
    
    workspace = {
      onCreate = {
        install = "pnpm install";
        default.openFiles = [ "src/app/page.tsx" ];
      };
    };

    # Correct way to enable Firebase Emulators in IDX
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "pnpm" "run" "dev" "3000" "--host" "0.0.0.0" "--port" "$PORT" ];
          manager = "web";
        };
      };
    };
  };
}