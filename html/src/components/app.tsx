import { h, Component } from "preact";
import axios from "axios";
import { Terminal } from "./terminal";

import type { ITerminalOptions, ITheme } from "@xterm/xterm";
import type { ClientOptions, FlowControl } from "./terminal/xterm";

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const path = window.location.pathname.replace(/[/]+$/, "");
const wsUrl = [
    protocol,
    "//",
    window.location.host,
    path,
    "/ws",
    window.location.search,
].join("");
const tokenUrl = [
    window.location.protocol,
    "//",
    window.location.host,
    path,
    "/token",
].join("");
const clientOptions = {
    rendererType: "webgl",
    disableLeaveAlert: false,
    disableResizeOverlay: false,
    enableZmodem: false,
    enableTrzsz: false,
    enableSixel: false,
    isWindows: false,
    unicodeVersion: "11",
} as ClientOptions;

const termOptions = {
    fontSize: 13,
    fontFamily: "Consolas,Liberation Mono,Menlo,Courier,monospace",
    theme: {
        foreground: "#d2d2d2",
        background: "#2b2b2b",
        cursor: "#adadad",
        black: "#000000",
        red: "#d81e00",
        green: "#5ea702",
        yellow: "#cfae00",
        blue: "#427ab3",
        magenta: "#89658e",
        cyan: "#00a7aa",
        white: "#dbded8",
        brightBlack: "#686a66",
        brightRed: "#f54235",
        brightGreen: "#99e343",
        brightYellow: "#fdeb61",
        brightBlue: "#84b0d8",
        brightMagenta: "#bc94b7",
        brightCyan: "#37e6e8",
        brightWhite: "#f1f1f0",
    } as ITheme,
    allowProposedApi: true,
} as ITerminalOptions;

const flowControl = {
    limit: 100000,
    highWater: 10,
    lowWater: 4,
} as FlowControl;

interface AppState {
    apiError: boolean;
    apiResponse: "completed" | "pending";
}

export class App extends Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            apiResponse: "pending",
            apiError: false,
        };
    }

    componentDidMount(): void {
        window.addEventListener("message", this.handleMessage);
    }

    componentWillUnmount(): void {
        window.removeEventListener("message", this.handleMessage);
    }

    handleMessage = (event: MessageEvent) => {
        if (typeof event.data === "string") {
            try {
                const parsedData = JSON.parse(event.data);
                this.accessShell(parsedData.token, parsedData.buildId);
            } catch (error) {
                console.error("Error parsing message data", error);
                this.setState({ apiError: true, apiResponse: "completed" });
            }
        }
    };

    accessShell = (token: string, buildId: string) => {
        const formData = new FormData();
        formData.append("build_id", buildId);

        const config = {
            method: "post",
            url: `https://api.click2deploy.com/api/v1/builds/shell-auth`,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
            data: formData,
        };

        axios(config)
            .then((response) => {
                console.log(response.data);
                this.setState({ apiResponse: "completed", apiError: false });
            })
            .catch((error) => {
                console.error(error);
                alert(error.message);
                alert(
                    "Error: You are not authorized to access this page. Please try again later.",
                );
                this.setState({ apiResponse: "completed", apiError: true });
                window.location.href = "https://click2deploy.com/";
            });
    };

    render() {
        const { apiResponse, apiError } = this.state;

        if (apiResponse === "pending") {
            return (
                <div>
                    <div>Loading.. </div>
                    <iframe
                        style={{ display: "none" }}
                        src="https://click2deploy.com/project"
                    >
                        Ifrarme
                    </iframe>
                </div>
            );
        }

        if (apiError) {
            return (
                <div>
                    Error: You are not authorized to access this page. Please
                    try again later.
                </div>
            );
        }

        return (
            <div style={{ height: "100vh" }}>
                <Terminal
                    id="terminal-container"
                    wsUrl={wsUrl}
                    tokenUrl={tokenUrl}
                    clientOptions={clientOptions}
                    termOptions={termOptions}
                    flowControl={flowControl}
                />
                <iframe
                    style={{ display: "none" }}
                    src="https://click2deploy.com/project"
                >
                    Ifrarme
                </iframe>
            </div>
        );
    }
}
