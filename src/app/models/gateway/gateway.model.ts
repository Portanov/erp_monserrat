export interface GatewayResponse<T = any> {
    statusCode: number;
    intOpCode: string;
    data: T;
}

export interface ApiErrorResponse {
    statusCode: number;
    intOpCode: string;
    data: {
        message: string;
    };
}

export function extractData<T>(response: GatewayResponse<T>): T {
    return response.data;
}