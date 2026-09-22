import "dotenv/config";
import bcrypt from "bcrypt";

const hashing = async () => {
    const hash1 = await bcrypt.hash("miClave123", 10); // salt A
    const hash2 = await bcrypt.hash("miClave123", 10); // salt B, mismo password

    console.log(hash1);
    console.log(hash2);
}

hashing()