import Request from ".";
import type { UpdateJson } from "../../types/type";

export async function getServiceHash(url: string): Promise<UpdateJson | null> {
    try {
        let updateJson = await Request<UpdateJson>(url, {
            encoding: 'utf-8',
            timeout: 4000,
            method: 'GET',
            type: 'JSON'
        })
        return updateJson
    } catch (error) {
        return null
    }
}