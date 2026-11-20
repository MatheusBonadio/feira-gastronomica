const LADO = 512;

export async function prepararFoto(arquivo: File): Promise<File> {
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" }).catch(() => createImageBitmap(arquivo));
    const lado = Math.min(bitmap.width, bitmap.height);
    const destino = Math.min(LADO, lado);
    const canvas = document.createElement("canvas");
    canvas.width = destino;
    canvas.height = destino;
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("Canvas indisponível.");

    const desenhar = (fundo?: string) => {
        contexto.clearRect(0, 0, destino, destino);
        if (fundo) {
            contexto.fillStyle = fundo;
            contexto.fillRect(0, 0, destino, destino);
        }
        contexto.imageSmoothingQuality = "high";
        contexto.drawImage(bitmap, (bitmap.width - lado) / 2, (bitmap.height - lado) / 2, lado, lado, 0, 0, destino, destino);
    };
    const gerar = (tipo: string) => new Promise<Blob | null>((pronto) => canvas.toBlob(pronto, tipo, 0.86));

    desenhar();
    let blob = await gerar("image/webp");
    if (!blob || blob.type !== "image/webp") {
        desenhar("#ffffff");
        blob = await gerar("image/jpeg");
    }
    bitmap.close();
    if (!blob) throw new Error("Não foi possível gerar a imagem.");

    return new File([blob], blob.type === "image/webp" ? "foto.webp" : "foto.jpg", { type: blob.type });
}
