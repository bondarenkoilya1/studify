package middlewares

import (
	"context"
	"studify/internal/models"
)

func GetUserID(ctx context.Context) models.UserID {
	return ctx.Value(models.UserIDKey).(models.UserID)
}
