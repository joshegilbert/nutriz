{ pkgs, ... }: {
  channel = "unstable";
  packages = [
    pkgs.nodejs_22
  ];
}
