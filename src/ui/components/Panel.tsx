import { ErrorBanner } from "./ErrorBanner";
import { Header } from "./Header";
import { QueryList } from "./QueryList";
import { Toolbar } from "./Toolbar";

export function Panel({
    doc,
    win,
    onMinimize,
    onClose,
}: {
    doc: Document;
    win: Window;
    onMinimize: () => void;
    onClose: () => void;
}) {
    return (
        <>
            <Header onMinimize={onMinimize} onClose={onClose} />
            <Toolbar doc={doc} win={win} />
            <div class="csr-content">
                <ErrorBanner />
                <QueryList />
            </div>
        </>
    );
}
