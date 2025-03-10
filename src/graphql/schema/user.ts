import { buildSchema } from "graphql";

export const userSchema = buildSchema(`#graphql
    input Auth {
        username: String
        email: String
        password: String
        socialId: String
        type: String
    }

    type User {
        id: ID!                # ID thay vì Int
        username: String
        email: String
        createdAt: String
    }

    type NotificationResult {
        id: ID!
        userId: ID!            # Đổi thành ID! để đúng với khóa chính của users
        groupName: String!
        emails: String!     # Chuyển emails thành danh sách thay vì String
    }

    type AuthResponse {
        user: User!
        notifications: [NotificationResult!]!
    }

    type AuthLogoutResponse {
        message: String
    }

    type CurrentUserResponse {
        user: User
        notifications: [NotificationResult!]!
    }

    type Query {
        checkCurrentUser: CurrentUserResponse
    }

    type Mutation {
        loginUser(username: String, email: String, password: String): AuthResponse!
        registerUser(user: Auth): AuthResponse!
        authSocialUser(user: Auth): AuthResponse!
        logout: AuthLogoutResponse
    }
`);
