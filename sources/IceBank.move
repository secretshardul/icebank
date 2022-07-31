module IceBank::UserInfo {
    use std::string;
    use std::signer;
    
    struct UserProfile has key { username: string::String }
    
    public fun get_username(user_addr: address): string::String acquires UserProfile {
        borrow_global<UserProfile>(user_addr).username
    }

    public entry fun set_username(account: &signer, message_bytes: vector<u8>) acquires UserProfile {
        let msg = string::utf8(message_bytes);
        let user_addr = signer::address_of(account);

        if (!exists<UserProfile>(user_addr)) {
            move_to(account, UserProfile {
                username: msg,
            })
        } else {
            let user_profile = borrow_global_mut<UserProfile>(user_addr);
            user_profile.username = msg;
        }
    }

    #[test(account = @0x1)]
    public entry fun can_set_username(account: &signer) acquires UserProfile {
        let addr = signer::address_of(account);
        set_username(account, b"noob");

        assert!(
            get_username(addr) == string::utf8(b"noob"),
            0
        );
    }
}
