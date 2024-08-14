FROM golang:bullseye

RUN go install github.com/CtrlSpice/otel-desktop-viewer@latest

CMD ["otel-desktop-viewer", "--browser", "8000"]
