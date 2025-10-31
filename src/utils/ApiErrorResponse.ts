class ApiErrorRes extends Error {
    statusCode: number;
    success: boolean;
    errors: string[];
    data: null;

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: string[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
        this.data = null;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiErrorRes;