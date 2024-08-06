#! /bin/bash

touch .Xauthority

umask 0077
mkdir -p "$HOME/.vnc"
chmod go-rwx "$HOME/.vnc"
vncpasswd -f <<<"unipept" >"$HOME/.vnc/passwd"
vncserver -geometry 1920x1080
