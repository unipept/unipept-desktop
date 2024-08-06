FROM mcr.microsoft.com/devcontainers/base:ubuntu

RUN apt update
RUN apt install --yes xfce4 xfce4-goodies gnome-icon-theme dbus-x11 xfce4-terminal tightvncserver
# Register xfce4-terminal as an alternative for x-terminal-emulator
RUN update-alternatives --install /usr/bin/x-terminal-emulator x-terminal-emulator /usr/bin/xfce4-terminal 50
# Set xfce4-terminal as the default x-terminal-emulator
RUN update-alternatives --set x-terminal-emulator /usr/bin/xfce4-terminal

