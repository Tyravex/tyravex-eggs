FROM docker.io/steamcmd/steamcmd@sha256:a42d62fd3bf4f0a70d4d83c16dfd03a080a50ab02dab91cf2e32e6084e14a509
USER root
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 libpulse0 && rm -rf /var/lib/apt/lists/* \
 && cp -a /root/.local/share/Steam/steamcmd /opt/steamcmd && chmod -R a+rX /opt/steamcmd
LABEL dev.tyravex.runtime="valheim-v1"
