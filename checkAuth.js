import config from "./config";
import db from "./firestore";

async function checkAuth(headers, isAdmin) {
    const token = headers["x-authorization"];
    if (token === null) {
        return false;
    }

    const auth = await db.getAuth(token);

    if (auth === null) {
        return false;
    }

    if (isAdmin && !auth.isAdmin) {
        return false;
    }

    return true;
}

export default checkAuth;
